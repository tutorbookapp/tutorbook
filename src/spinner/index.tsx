import styles from './index.module.scss'

/**
 * React component that puts a fast-moving spinner (and back-drop) on top of any 
 * relatively positioned parent.
 * @example
 * <FormCard>
 *   <Spinner active={this.state.isLoading} />
 *   <Form />
 * </FormCard>
 */
export default function Spinner(props: { active: boolean; }) {
  return (
    <div className={styles.wrapper + 
      (props.active ? ' ' + styles.wrapperActive : '')}>
      <div className={styles.spinner} />
    </div>
  );
}
